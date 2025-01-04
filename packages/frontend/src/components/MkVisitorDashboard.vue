<template>
<div v-if="instance" :class="$style.root">
        <div :class="[$style.main, $style.panel]">
                <img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.mainIcon"/>
                <button class="_button _acrylic" :class="$style.mainMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
                <div :class="$style.mainFg">
                        <h1 :class="$style.mainTitle">
                                <span>{{ instanceName }}</span>
                        </h1>
                        <div :class="$style.mainAbout">
                                <div v-html="instance.description || i18n.ts.headlineMisskey"></div>
                        </div>
                        <div v-if="instance.disableRegistration" :class="$style.mainWarn">
                                <MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
                        </div>
                        <div class="_gaps_s" :class="$style.mainActions">
                                <!-- Buttons -->
                                <MkButton 
                                    v-if="!isWalletConnectActive" 
                                    :class="$style.mainAction" 
                                    full 
                                    rounded 
                                    gradate 
                                    data-cy-signup 
                                    style="margin-right: 12px;" 
                                    @click="signup()"
                                >
                                    {{ i18n.ts.joinThisServer }}
                                </MkButton>

                                <MkButton 
                                    v-if="!isWalletConnectActive" 
                                    :class="$style.mainAction" 
                                    full 
                                    rounded 
                                    data-cy-signin 
                                    @click="signin()"
                                >
                                    {{ i18n.ts.login }}
                                </MkButton>

                                <MkButton 
                                    v-if="!isWalletConnectActive" 
                                    :class="$style.mainAction" 
                                    full 
                                    rounded 
                                    data-cy-signin 
                                    @click="startWalletConnectFlow"
                                >
                                    Login by Wallet
                                </MkButton>    

                                <MkButton 
                                    v-if="isWalletConnectActive" 
                                    :class="$style.mainAction" 
                                    full 
                                    rounded 
                                    data-cy-signin 
                                    @click="startWalletApprovalFlow"
                                >
                                    {{ isWalletUserRegistered ? 'Approve Sign in' : 'Approve Sign up' }}
                                </MkButton>

                                <MkButton 
                                    v-if="isWalletConnectActive" 
                                    :class="$style.mainAction" 
                                    full 
                                    rounded 
                                    data-cy-signin 
                                    @click="disconnectWalletConnectFlow"
                                >
                                    Disconnect Wallet
                                </MkButton>
                        </div>
                </div>
        </div>
        <div v-if="stats" :class="$style.stats">
                <div :class="[$style.statsItem, $style.panel]">
                        <div :class="$style.statsItemLabel">{{ i18n.ts.users }}</div>
                        <div :class="$style.statsItemCount"><MkNumber :value="stats.originalUsersCount"/></div>
                </div>
                <div :class="[$style.statsItem, $style.panel]">
                        <div :class="$style.statsItemLabel">{{ i18n.ts.notes }}</div>
                        <div :class="$style.statsItemCount"><MkNumber :value="stats.originalNotesCount"/></div>
                </div>
        </div>
        <div v-if="instance.policies.ltlAvailable" :class="[$style.tl, $style.panel]">
                <div :class="$style.tlHeader">{{ i18n.ts.letsLookAtTimeline }}</div>
                <div :class="$style.tlBody">
                        <MkTimeline src="local"/>
                </div>
        </div>
        <div :class="$style.panel">
                <XActiveUsersChart/>
        </div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import MkButton from '@/components/MkButton.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instanceName } from '@@/js/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import MkNumber from '@/components/MkNumber.vue';
import XActiveUsersChart from '@/components/MkVisitorDashboard.ActiveUsersChart.vue';
import { openInstanceMenu } from '@/ui/_common_/common.js';
import { isWalletConnectActive, isWalletUserRegistered, walletAddress, walletSignature, startWalletConnect, onWalletDisconnect } from '@/account';

const stats = ref<Misskey.entities.StatsResponse | null>(null);

misskeyApi('stats', {}).then((res) => {
    stats.value = res;
});

async function startWalletConnectFlow() {
    try {
        await startWalletConnect();
    } catch (error) {
        console.error('Error during WalletConnect:', error);
    }
}

async function startWalletApprovalFlow() {
    try {
        await startWalletConnect();
    } catch (error) {
        console.error('Error during Wallet Approval:', error);
    }
}

async function disconnectWalletConnectFlow() {
    try {
        await onWalletDisconnect();
    } catch (error) {
        console.error('Error during Wallet Disconnect:', error);
    }
}

function signin() {
    const { dispose } = os.popup(XSigninDialog, {
        autoSet: true,
    }, {
        closed: () => dispose(),
    });
}

function signup() {
    const { dispose } = os.popup(XSignupDialog, {
        autoSet: true,
    }, {
        closed: () => dispose(),
    });
}

function showMenu(ev: MouseEvent) {
    openInstanceMenu(ev);
}
</script>

<style lang="scss" module>
.root {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 32px 0 0 0;
}

.panel {
    position: relative;
    background: var(--MI_THEME-panel);
    border-radius: var(--MI-radius);
    box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
}

.main {
    text-align: center;
}

.mainActions {
    padding: 32px;
}
</style>
