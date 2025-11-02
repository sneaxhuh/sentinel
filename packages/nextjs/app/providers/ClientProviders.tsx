'use client';

import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia, baseSepolia, celo } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, connectorsForWallets, darkTheme } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  braveWallet,
  ledgerWallet,
  argentWallet,
  trustWallet,
  imTokenWallet,
  omniWallet,
  tahoWallet,
  xdefiWallet,
  zerionWallet,
  injectedWallet,
  safeWallet,
  coreWallet,
  bitgetWallet,
  bifrostWallet,
  bitskiWallet,
  bloomWallet,
  frameWallet,
  frontierWallet,
  okxWallet,
  oneKeyWallet,
  phantomWallet,
  rabbyWallet,
  roninWallet,
  subWallet,
  tokenPocketWallet,
  uniswapWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthProvider';
import '@rainbow-me/rainbowkit/styles.css';

// Define Celo Sepolia testnet
const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://sepolia-blockscout.celo-testnet.org',
    },
  },
  testnet: true,
} as const;

// Define Moonbase Alpha testnet
const moonbaseAlpha = {
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: {
    decimals: 18,
    name: 'DEV',
    symbol: 'DEV',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.api.moonbase.moonbeam.network'],
    },
    public: {
      http: ['https://rpc.api.moonbase.moonbeam.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Moonscan',
      url: 'https://moonbase.moonscan.io',
    },
  },
  testnet: true,
} as const;

// Define Polkadot Asset Hub Testnet
const polkadotAssetHub = {
  id: 420420422, // Asset Hub Paseo Testnet chain ID (0x190f1b46)
  name: 'Polkadot Asset Hub Testnet (Paseo)',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polkadot Asset Hub Explorer',
      url: 'https://assethub-paseo.subscan.io',
    },
  },
  testnet: true,
} as const;

const chains = [polkadotAssetHub, moonbaseAlpha, celo, celoSepolia, mainnet, polygon, optimism, arbitrum, base, sepolia, baseSepolia] as const;

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        coinbaseWallet,
        rainbowWallet,
        injectedWallet,
      ],
    },
    {
      groupName: 'Browser',
      wallets: [
        braveWallet,
        frameWallet,
        frontierWallet,
      ],
    },
    {
      groupName: 'Hardware',
      wallets: [
        ledgerWallet,
        safeWallet,
      ],
    },
    {
      groupName: 'Mobile',
      wallets: [
        trustWallet,
        argentWallet,
        imTokenWallet,
        omniWallet,
        tokenPocketWallet,
        subWallet,
      ],
    },
    {
      groupName: 'Exchange',
      wallets: [
        okxWallet,
        bitgetWallet,
        coreWallet,
        oneKeyWallet,
        bifrostWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        tahoWallet,
        xdefiWallet,
        zerionWallet,
        bitskiWallet,
        bloomWallet,
        phantomWallet,
        rabbyWallet,
        roninWallet,
        uniswapWallet,
      ],
    },
  ],
  {
    appName: 'Your App Name',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  }
);

const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [polkadotAssetHub.id]: http('https://testnet-passet-hub-eth-rpc.polkadot.io'),
    [moonbaseAlpha.id]: http(),
    [celo.id]: http(),
    [celoSepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const customTheme = darkTheme({
  accentColor: '#000000', 
  accentColorForeground: '#ffffff', 
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

customTheme.colors.modalBackground = '#1a1a1a';
customTheme.colors.modalBorder = '#333333';
customTheme.colors.generalBorder = '#404040';
customTheme.colors.actionButtonBorder = '#000000';
customTheme.colors.actionButtonBorderMobile = '#000000';
customTheme.colors.actionButtonSecondaryBackground = '#2a2a2a';
customTheme.colors.closeButton = '#ffffff';
customTheme.colors.closeButtonBackground = '#000000';
customTheme.colors.connectButtonBackground = '#000000';
customTheme.colors.connectButtonBackgroundError = '#1a1a1a';
customTheme.colors.connectButtonInnerBackground = '#000000';
customTheme.colors.connectButtonText = '#ffffff';
customTheme.colors.connectButtonTextError = '#ff4444';
customTheme.colors.connectionIndicator = '#00ff00';
customTheme.colors.downloadBottomCardBackground = '#1a1a1a';
customTheme.colors.downloadTopCardBackground = '#000000';
customTheme.colors.error = '#ff4444';
customTheme.colors.generalBorderDim = '#2a2a2a';
customTheme.colors.menuItemBackground = '#1a1a1a';
customTheme.colors.modalBackdrop = 'rgba(0, 0, 0, 0.8)';
customTheme.colors.profileAction = '#1a1a1a';
customTheme.colors.profileActionHover = '#2a2a2a';
customTheme.colors.profileForeground = '#000000';
customTheme.colors.selectedOptionBorder = '#ffffff';
customTheme.colors.standby = '#ffaa00';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={customTheme}
            modalSize="compact"
            initialChain={celoSepolia}
            showRecentTransactions={true}
            coolMode={true}
          >
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  fontSize: '16px',
                  padding: '16px 20px',
                  minWidth: '300px',
                  maxWidth: '500px',
                  border: '1px solid #333333',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#00ff00',
                    secondary: '#000',
                  },
                  style: {
                    fontSize: '16px',
                    padding: '16px 20px',
                    minWidth: '300px',
                    background: '#1a1a1a',
                    border: '1px solid #00ff00',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ff4444',
                    secondary: '#fff',
                  },
                  style: {
                    fontSize: '16px',
                    padding: '16px 20px',
                    minWidth: '300px',
                    background: '#1a1a1a',
                    border: '1px solid #ff4444',
                  },
                },
                loading: {
                  style: {
                    fontSize: '16px',
                    padding: '16px 20px',
                    minWidth: '300px',
                    background: '#1a1a1a',
                    border: '1px solid #333333',
                  },
                },
              }}
            />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    </AuthProvider>
  );
}