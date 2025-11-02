import { NextResponse } from 'next/server'
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from '@selfxyz/core'
import { publishVerificationUpdate } from '@/lib/verifyEvents'

// Configure from environment, aligned with /self page
const SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE || 'self'
const ENDPOINT = process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'http://localhost:3000/api/verify'
const USER_ID_TYPE: 'hex' | 'uuid' = 'hex'
const MOCK_PASSPORT = process.env.SELF_MOCK_PASSPORT === 'true' || process.env.NODE_ENV !== 'production'

// Reuse a single verifier instance
const selfBackendVerifier = new SelfBackendVerifier(
  SCOPE, // scope - matches frontend
  ENDPOINT, // endpoint - matches frontend
  false, // mockPassport: true for staging/testnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 0,
    excludedCountries: [],
    ofac: false,
  }),
  "hex" // userIdentifierType - matches frontend userId type
);

// Module-level storage of last verification data
let lastNullifier: string | null = null
let lastUserIdentifier: string | null = null

export async function POST(req: Request) {
  try {
    console.log('[verify] Verification request received')

    const { attestationId, proof, publicSignals, userContextData } = await req.json()

    console.log('[verify] Received payload:', {
      attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      userContextData,
      userContextDataType: typeof userContextData,
    })

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      console.error('[verify] Missing required fields')
      return NextResponse.json(
        {
          status: 'error',
          result: false,
          reason: 'Proof, publicSignals, attestationId and userContextData are required',
        },
        { status: 200 }
      )
    }

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    )

    console.log('[verify] Verification result:', JSON.stringify(result, null, 2))

    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails

    if (isValid && isMinimumAgeValid && isOfacValid) {
      const identityCommitment =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result.discloseOutput as any)?.identityCommitment ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result.discloseOutput as any)?.identity_commitment ||
        `identity_${Date.now()}`

      // Capture minimal globals: nullifier and userIdentifier
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastNullifier = (result.discloseOutput as any)?.nullifier ?? null
      lastUserIdentifier = result.userData?.userIdentifier ?? null

      // Publish SSE update
      publishVerificationUpdate({
        nullifier: lastNullifier,
        userIdentifier: lastUserIdentifier,
        timestamp: new Date().toISOString(),
      })

      console.log('[verify] Verification successful. Identity commitment:', identityCommitment)

      return NextResponse.json(
        {
          status: 'success',
          result: true,
          identityCommitment,
          // Echo minimal fields explicitly as well
          nullifier: lastNullifier,
          userIdentifier: lastUserIdentifier,
        },
        { status: 200 }
      )
    }

    let reason = 'Verification failed'
    if (!isMinimumAgeValid) reason = 'Minimum age verification failed'
    if (!isOfacValid) reason = 'OFAC verification failed'
    if (!isValid) reason = 'Proof verification failed'

    console.error('[verify] Verification failed:', JSON.stringify(result.isValidDetails, null, 2))

    // Also publish a failed update with current (likely null) values
    publishVerificationUpdate({
      nullifier: lastNullifier,
      userIdentifier: lastUserIdentifier,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { status: 'error', result: false, reason },
      { status: 200 }
    )
  } catch (error) {
    console.error('[verify] Error while verifying:', error)
    return NextResponse.json(
      {
        status: 'error',
        result: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}

// GET the latest verification globals (nullifier and userIdentifier)
export async function GET() {
  return NextResponse.json(
    {
      nullifier: lastNullifier,
      userIdentifier: lastUserIdentifier,
    },
    { status: 200 }
  )
}
