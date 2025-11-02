'use client';

import { useState, useEffect } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useSidebar } from "@/components/ui/sidebar"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAccount } from 'wagmi';
import { Github, Wallet, AlertCircle } from "lucide-react";
import { WEBSITE_LOGO_PATH as LOGO_PATH, WEBSITE_NAME, WEBSITE_TITLE_FONT as WEBSITE_FONT } from "@/utils/constants/navbarConstants"

export function Navbar() {
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  
  const bothConnected = session && isConnected;
  const needsConnection = !session || !isConnected;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/95 border-b border-green-400/30 backdrop-blur-sm font-upheaval">
      <div className="flex h-20 items-center px-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-4 group">
            
            <span className="text-4xl font-bold text-green-400 tracking-wider uppercase group-hover:text-green-300 transition-colors duration-300">
              {WEBSITE_NAME}
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a 
                    href="https://ironjams-organization.gitbook.io/celution/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 w-max items-center justify-center bg-black/80 border-2 border-green-400/50 px-6 py-3 text-base font-bold text-green-400 hover:border-green-400 hover:bg-green-900/20 transition-all duration-300 uppercase tracking-wider"
                  >
                    ABOUT
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>


              
            </NavigationMenuList>
          </NavigationMenu>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            {/* GitHub Status */}
            <div className="flex items-center gap-2">
              {mounted ? (
                session ? (
                  <div className="relative group">
                    <div className="bg-green-400/20 border-2 border-green-400 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-green-400 hover:text-black transition-all duration-300">
                      <Github className="w-4 h-4 text-green-400" />
                      <span className="font-bold text-sm font-upheaval text-green-300">@{session.user?.githubUsername}</span>
                    </div>
                    {/* Dropdown menu */}
                    <div className="absolute top-full right-0 mt-2 bg-black/95 border-2 border-green-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-48">
                      <div className="p-2">
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                          <Github className="w-4 h-4 text-green-400" />
                          <div>
                            <p className="font-bold text-green-400 text-sm font-upheaval">@{session.user?.githubUsername}</p>
                            <p className="text-xs text-green-100 font-upheaval">{session.user?.email}</p>
                          </div>
                        </div>
                        <hr className="border-green-400/30 border-t mb-2" />
                        <Button
                          onClick={() => signOut()}
                          className="w-full bg-red-500/20 text-red-400 border-2 border-red-400 px-3 py-2 flex items-center gap-2 hover:bg-red-400 hover:text-black transition-all duration-300 text-left justify-start font-upheaval"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-bold text-sm">DISCONNECT</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => signIn('github')}
                    className="bg-red-500/20 text-red-400 border-2 border-red-400 px-3 py-2 flex items-center gap-2 hover:bg-red-400 hover:text-black transition-all duration-300 font-upheaval"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">CONNECT GITHUB</span>
                  </Button>
                )
              ) : (
                // Skeleton/placeholder during hydration
                <div className="bg-green-400/20 border-2 border-green-400/50 px-3 py-2 animate-pulse">
                  <div className="w-32 h-4 bg-green-400/30"></div>
                </div>
              )}
            </div>

            {/* Wallet Status */}
            <div className="flex items-center gap-2">
              {mounted ? (
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted: connectMounted,
                  }) => {
                    const ready = connectMounted && authenticationStatus !== 'loading';
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          'style': {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="inline-flex h-12 w-max items-center justify-center bg-black/80 border-2 border-green-400/50 px-6 py-3 text-base font-bold text-green-400 hover:border-green-400 hover:bg-green-900/20 transition-all duration-300 font-upheaval uppercase tracking-wider"
                              >
                                <Wallet className="w-5 h-5 mr-2" />
                                Connect Wallet
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="inline-flex h-12 w-max items-center justify-center bg-red-500/20 border-2 border-red-400 px-6 py-3 text-base font-bold text-red-400 hover:bg-red-400 hover:text-black transition-all duration-300 font-mono uppercase tracking-wider"
                              >
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Wrong Network
                              </button>
                            );
                          }

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={openChainModal}
                                className="inline-flex h-12 w-max items-center justify-center bg-green-400/20 border-2 border-green-400 px-6 py-3 text-base font-bold text-green-400 hover:bg-green-400 hover:text-black transition-all duration-300 font-mono uppercase tracking-wider"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 20,
                                      height: 20,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginRight: 8,
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 20, height: 20 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>

                              <button
                                onClick={openAccountModal}
                                className="inline-flex h-12 w-max items-center justify-center bg-green-400/20 border-2 border-green-400 px-6 py-3 text-base font-bold text-green-400 hover:bg-green-400 hover:text-black transition-all duration-300 font-mono"
                              >
                                <div className="w-5 h-5 bg-green-400 rounded-full mr-2 flex items-center justify-center">
                                  <div className="w-3 h-3 bg-black rounded-full"></div>
                                </div>
                                {account.displayName}
                                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              ) : (
                // Skeleton/placeholder during hydration
                <div className="bg-green-400/20 border-2 border-green-400/50 px-3 py-2 animate-pulse">
                  <div className="w-24 h-4 bg-green-400/30"></div>
                </div>
              )}
            </div>

            {/* Onboarding Prompt */}
            {needsConnection && (
              <Link href="/onboarding">
                <Button className="bg-green-400 text-black border-2 border-green-400 hover:bg-green-500 font-bold font-mono uppercase tracking-wider transition-all duration-300">
                  Complete Setup
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}