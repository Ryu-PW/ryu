/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, reactive, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { apiUrl } from '@@/js/config.js';
import type { MenuItem, MenuButton } from '@/types/menu.js';
import { showSuspendedDialog } from '@/scripts/show-suspended-dialog.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { del, get, set } from '@/scripts/idb-proxy.js';
import { waiting, popup, popupMenu, success, alert } from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { unisonReload, reloadChannel } from '@/scripts/unison-reload.js';

// CHANGE: imports for walletconnect
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/vue';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/vue'
import type { Provider } from '@reown/appkit-adapter-solana'
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

async function initializeAppKit() {
  try {
    
    // Prepare metadata and projectId
    const projectId = 'ed9c3dd393ccbe69b5936ff8244fa97d';
    const metadata = {
      name: 'Ryu',
      description: 'The Meta Social Network',
      url: 'https://ryu.pw',
      icons: ['https://avatars.githubusercontent.com/u/179229932'],
    };

    const solanaWeb3JsAdapter = new SolanaAdapter({
      wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    });

    await createAppKit({
      adapters: [solanaWeb3JsAdapter],
      networks: [solana],
      metadata,
      projectId,
      defaultNetwork: solana,
      features: {
        analytics: true,
      },
    });
    console.log('AppKit initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize AppKit:', error);
  }
}

// Call initialization at module load
initializeAppKit();
// Reactive states
export const isWalletConnectActive = ref(false);
export const isWalletUserRegistered = ref(false);
export const walletAddress = ref(null);
let walletProvider = null;
export let walletSignature = null;

export async function startWalletConnect() {
  try {
    console.log('Starting WalletConnect...');
    const appKit = await useAppKit();

    // Get account details
    const appKitAccountTest = useAppKitAccount(); // Reactive state
    if (appKitAccountTest?.value?.address) {
      walletAddress.value = appKitAccountTest.value.address || null;
      isWalletConnectActive.value = !!appKitAccountTest.value.isConnected;

      // check if user exists
      isWalletUserRegistered.value = false;

      console.log('Wallet is registered. Proceeding...');
    } else {
      console.log('No wallet account connected.');
    }

    // Get provider details
    walletProvider = useAppKitProvider<Provider>('solana')

    // Condition for connected wallet and provider
    if (isWalletConnectActive.value && walletProvider) {
      console.log('Wallet is already connected, signing message...');
      await onWalletSignMessage(walletProvider);
    } else {
      console.log('Wallet is not connected. Opening WalletConnect UI...');
      await appKit.open(); // Open wallet connect dialog
    }

    // Get account details
    const appKitAccountRetest = useAppKitAccount(); // Reactive state
    if (appKitAccountRetest?.value?.address) {
      walletAddress.value = appKitAccountRetest.value.address || null;
      isWalletConnectActive.value = !!appKitAccountRetest.value.isConnected;
    
      // Automatically check if the user exists
      
      isWalletUserRegistered.value = false;

    }

    // Post-connection logging
    console.log('Wallet connection status:', {
      walletAddress: walletAddress.value,
      isWalletConnectActive: isWalletConnectActive.value,
      walletProvider: walletProvider,
    });
  } catch (error) {
    console.error('Wallet Connect Error:', error);
  }
}

export async function onWalletSignMessage(walletProvider: Provider['walletProvider']) {
  try {
    // get provider if empty
    console.log(walletProvider);
    // 2. Encode message and sign it
    const encodedMessage = new TextEncoder().encode('Login by Wallet to the Ryu Platform')
    console.log(encodedMessage);
    const signature = await walletProvider.walletProvider.signMessage(encodedMessage);
    console.log(signature);
    if (signature){
      console.log("signed");
      walletSignature = signature;
    } 
  }catch (error) {
    console.error('Wallet Signature Error:', error);
  }
}
export async function onWalletDisconnect() {
  try {
    const { disconnect } = await useDisconnect()
 
    await disconnect();
    isWalletConnectActive.value = false;
  }catch (error) {
    console.error('Wallet Disconnect Error:', error)
  }
}
// Simulating the wallet address (replace with actual implementation)
export const signedMessage = ref('');
// TODO: 他のタブと永続化された

type Account = Misskey.entities.MeDetailed & { token: string };

const accountData = miLocalStorage.getItem('account');

// TODO: 外部からはreadonlyに
export const $i = accountData ? reactive(JSON.parse(accountData) as Account) : null;

export const iAmModerator = $i != null && ($i.isAdmin === true || $i.isModerator === true);
export const iAmAdmin = $i != null && $i.isAdmin;

export function signinRequired() {
	if ($i == null) throw new Error('signin required');
	return $i;
}

export let notesCount = $i == null ? 0 : $i.notesCount;
export function incNotesCount() {
	notesCount++;
}

export async function signout() {
	if (!$i) return;

	waiting();
	miLocalStorage.removeItem('account');
	await removeAccount($i.id);
	const accounts = await getAccounts();

	//#region Remove service worker registration
	try {
		if (navigator.serviceWorker.controller) {
			const registration = await navigator.serviceWorker.ready;
			const push = await registration.pushManager.getSubscription();
			if (push) {
				await window.fetch(`${apiUrl}/sw/unregister`, {
					method: 'POST',
					body: JSON.stringify({
						i: $i.token,
						endpoint: push.endpoint,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
		}

		if (accounts.length === 0) {
			await navigator.serviceWorker.getRegistrations()
				.then(registrations => {
					return Promise.all(registrations.map(registration => registration.unregister()));
				});
		}
	} catch (err) {}
	//#endregion

	if (accounts.length > 0) login(accounts[0].token);
	else unisonReload('/');
}

export async function getAccounts(): Promise<{ id: Account['id'], token: Account['token'] }[]> {
	return (await get('accounts')) || [];
}

export async function addAccount(id: Account['id'], token: Account['token']) {
	const accounts = await getAccounts();
	if (!accounts.some(x => x.id === id)) {
		await set('accounts', accounts.concat([{ id, token }]));
	}
}

export async function removeAccount(idOrToken: Account['id']) {
	const accounts = await getAccounts();
	const i = accounts.findIndex(x => x.id === idOrToken || x.token === idOrToken);
	if (i !== -1) accounts.splice(i, 1);

	if (accounts.length > 0) {
		await set('accounts', accounts);
	} else {
		await del('accounts');
	}
}

function fetchAccount(token: string, id?: string, forceShowDialog?: boolean): Promise<Account> {
	return new Promise((done, fail) => {
		window.fetch(`${apiUrl}/i`, {
			method: 'POST',
			body: JSON.stringify({
				i: token,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(res => new Promise<Account | { error: Record<string, any> }>((done2, fail2) => {
				if (res.status >= 500 && res.status < 600) {
					// サーバーエラー(5xx)の場合をrejectとする
					// （認証エラーなど4xxはresolve）
					return fail2(res);
				}
				res.json().then(done2, fail2);
			}))
			.then(async res => {
				if ('error' in res) {
					if (res.error.id === 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370') {
						// SUSPENDED
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await showSuspendedDialog();
						}
					} else if (res.error.id === 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a') {
						// USER_IS_DELETED
						// アカウントが削除されている
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await alert({
								type: 'error',
								title: i18n.ts.accountDeleted,
								text: i18n.ts.accountDeletedDescription,
							});
						}
					} else if (res.error.id === 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14') {
						// AUTHENTICATION_FAILED
						// トークンが無効化されていたりアカウントが削除されたりしている
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await alert({
								type: 'error',
								title: i18n.ts.tokenRevoked,
								text: i18n.ts.tokenRevokedDescription,
							});
						}
					} else {
						await alert({
							type: 'error',
							title: i18n.ts.failedToFetchAccountInformation,
							text: JSON.stringify(res.error),
						});
					}

					// rejectかつ理由がtrueの場合、削除対象であることを示す
					fail(true);
				} else {
					(res as Account).token = token;
					done(res as Account);
				}
			})
			.catch(fail);
	});
}

export function updateAccount(accountData: Account) {
	if (!$i) return;
	for (const key of Object.keys($i)) {
		delete $i[key];
	}
	for (const [key, value] of Object.entries(accountData)) {
		$i[key] = value;
	}
	miLocalStorage.setItem('account', JSON.stringify($i));
}

export function updateAccountPartial(accountData: Partial<Account>) {
	if (!$i) return;
	for (const [key, value] of Object.entries(accountData)) {
		$i[key] = value;
	}
	miLocalStorage.setItem('account', JSON.stringify($i));
}

export async function refreshAccount() {
	if (!$i) return;
	return fetchAccount($i.token, $i.id)
		.then(updateAccount, reason => {
			if (reason === true) return signout();
			return;
		});
}

export async function login(token: Account['token'], redirect?: string) {
	const showing = ref(true);
	const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkWaitingDialog.vue')), {
		success: false,
		showing: showing,
	}, {
		closed: () => dispose(),
	});
	if (_DEV_) console.log('logging as token ', token);
	const me = await fetchAccount(token, undefined, true)
		.catch(reason => {
			if (reason === true) {
				// 削除対象の場合
				removeAccount(token);
			}

			showing.value = false;
			throw reason;
		});
	miLocalStorage.setItem('account', JSON.stringify(me));
	document.cookie = `token=${token}; path=/; max-age=31536000`; // bull dashboardの認証とかで使う
	await addAccount(me.id, token);

	if (redirect) {
		// 他のタブは再読み込みするだけ
		reloadChannel.postMessage(null);
		// このページはredirectで指定された先に移動
		location.href = redirect;
		return;
	}

	unisonReload();
}

export async function openAccountMenu(opts: {
	includeCurrentAccount?: boolean;
	withExtraOperation: boolean;
	active?: Misskey.entities.UserDetailed['id'];
	onChoose?: (account: Misskey.entities.UserDetailed) => void;
}, ev: MouseEvent) {
	if (!$i) return;

	async function switchAccount(account: Misskey.entities.UserDetailed) {
		const storedAccounts = await getAccounts();
		const found = storedAccounts.find(x => x.id === account.id);
		if (found == null) return;
		switchAccountWithToken(found.token);
	}

	function switchAccountWithToken(token: string) {
		login(token);
	}

	const storedAccounts = await getAccounts().then(accounts => accounts.filter(x => x.id !== $i.id));
	const accountsPromise = misskeyApi('users/show', { userIds: storedAccounts.map(x => x.id) });

	function createItem(account: Misskey.entities.UserDetailed) {
		return {
			type: 'user' as const,
			user: account,
			active: opts.active != null ? opts.active === account.id : false,
			action: () => {
				if (opts.onChoose) {
					opts.onChoose(account);
				} else {
					switchAccount(account);
				}
			},
		};
	}

	const accountItemPromises = storedAccounts.map(a => new Promise<ReturnType<typeof createItem> | MenuButton>(res => {
		accountsPromise.then(accounts => {
			const account = accounts.find(x => x.id === a.id);
			if (account == null) return res({
				type: 'button' as const,
				text: a.id,
				action: () => {
					switchAccountWithToken(a.token);
				},
			});

			res(createItem(account));
		});
	}));

	const menuItems: MenuItem[] = [];

	if (opts.withExtraOperation) {
		menuItems.push({
			type: 'link',
			text: i18n.ts.profile,
			to: `/@${$i.username}`,
			avatar: $i,
		}, {
			type: 'divider',
		});

		if (opts.includeCurrentAccount) {
			menuItems.push(createItem($i));
		}

		menuItems.push(...accountItemPromises);

		menuItems.push({
			type: 'parent',
			icon: 'ti ti-plus',
			text: i18n.ts.addAccount,
			children: [{
				text: i18n.ts.existingAccount,
				action: () => {
					getAccountWithSigninDialog().then(res => {
						if (res != null) {
							success();
						}
					});
				},
			}, {
				text: i18n.ts.createAccount,
				action: () => {
					getAccountWithSignupDialog().then(res => {
						if (res != null) {
							switchAccountWithToken(res.token);
						}
					});
				},
			}],
		}, {
			type: 'link',
			icon: 'ti ti-users',
			text: i18n.ts.manageAccounts,
			to: '/settings/accounts',
		});
	} else {
		if (opts.includeCurrentAccount) {
			menuItems.push(createItem($i));
		}

		menuItems.push(...accountItemPromises);
	}

	popupMenu(menuItems, ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}

export function getAccountWithSigninDialog(): Promise<{ id: string, token: string } | null> {
    return new Promise((resolve) => {
        const { dispose } = popup(
            defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')),
            {
                additionalLoginMethods: [
                    {
                        text: i18n.ts.loginWithWallet, // Add "Login with Wallet"
                        action: async () => {
                            try {
                                await walletLogin(); // Call WalletConnect login
                                dispose(); // Close dialog on success
                                resolve(null);
                            } catch (e) {
                                console.error(e);
                            }
                        },
                    },
                ],
            },
            {
                done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
                    await addAccount(res.id, res.i);
                    resolve({ id: res.id, token: res.i });
                },
                cancelled: () => resolve(null),
                closed: () => dispose(),
            }
        );
    });
}

export function getAccountWithSignupDialog(): Promise<{ id: string, token: string } | null> {
	return new Promise((resolve) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSignupDialog.vue')), {}, {
			done: async (res: Misskey.entities.SignupResponse) => {
				await addAccount(res.id, res.token);
				resolve({ id: res.id, token: res.token });
			},
			cancelled: () => {
				resolve(null);
			},
			closed: () => {
				dispose();
			},
		});
	});
}

if (_DEV_) {
	(window as any).$i = $i;
}
