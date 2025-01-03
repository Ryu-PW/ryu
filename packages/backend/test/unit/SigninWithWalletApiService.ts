/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IncomingHttpHeaders } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, jest, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';
import { HttpHeader } from 'fastify/types/utils.js';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { MiUser } from '@/models/User.js';
import { MiUserProfile, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { CoreModule } from '@/core/CoreModule.js';
import { SigninWithWalletApiService } from '@/server/api/SigninWithWalletApiService.js';
import { RateLimiterService } from '@/server/api/RateLimiterService.js';
import { SigninService } from '@/server/api/SigninService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';

const moduleMocker = new ModuleMocker(global);

class FakeLimiter {
    public async limit() {
        return;
    }
}

class FakeSigninService {
    public signin(..._args: any): any {
        return true;
    }
}

class DummyFastifyReply {
    public statusCode: number;
    code(num: number): void {
        this.statusCode = num;
    }
    header(_key: HttpHeader, _value: any): void {}
}

class DummyFastifyRequest {
    public ip: string;
    public body: { walletAddress: string; signature: string };
    public headers: IncomingHttpHeaders = { accept: 'application/json' };
    constructor(body?: any) {
        this.ip = '0.0.0.0';
        this.body = body;
    }
}

type ApiFastifyRequestType = FastifyRequest<{
    Body: {
        walletAddress?: string;
        signature?: string;
    };
}>;

describe('SigninWithWalletApiService', () => {
    let app: TestingModule;
    let walletApiService: SigninWithWalletApiService;
    let usersRepository: UsersRepository;
    let userProfilesRepository: UserProfilesRepository;
    let idService: IdService;

    async function createUser(data: Partial<MiUser> = {}) {
        const user = await usersRepository.save({
            ...data,
        });
        return user;
    }

    async function createUserProfile(data: Partial<MiUserProfile> = {}) {
        const userProfile = await userProfilesRepository.save({
            ...data,
        });
        return userProfile;
    }

    beforeAll(async () => {
        app = await Test.createTestingModule({
            imports: [GlobalModule, CoreModule],
            providers: [
                SigninWithWalletApiService,
                { provide: RateLimiterService, useClass: FakeLimiter },
                { provide: SigninService, useClass: FakeSigninService },
            ],
        })
            .useMocker((token) => {
                if (typeof token === 'function') {
                    const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
                    const Mock = moduleMocker.generateFromMetadata(mockMetadata);
                    return new Mock();
                }
            })
            .compile();
        walletApiService = app.get<SigninWithWalletApiService>(SigninWithWalletApiService);
        usersRepository = app.get<UsersRepository>(DI.usersRepository);
        userProfilesRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
        idService = app.get<IdService>(IdService);
    });

    beforeEach(async () => {
        const uid = idService.gen();
        const dummyUser = {
            id: uid,
            username: uid,
            usernameLower: uid.toLocaleLowerCase(),
            uri: null,
            host: null,
        };
        const dummyProfile = {
            userId: uid,
            walletAddress: '0x1234567890abcdef',
        };
        await createUser(dummyUser);
        await createUserProfile(dummyProfile);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Verify Wallet Address and Signature', () => {
        it('Should sign in successfully with a valid wallet address and signature', async () => {
            const req = new DummyFastifyRequest({
                walletAddress: '0x1234567890abcdef',
                signature: 'valid_signature',
            }) as ApiFastifyRequestType;
            const res = new DummyFastifyReply() as FastifyReply;
            const res_body = await walletApiService.signin(req, res);
            expect(res.statusCode).toBe(200);
            expect((res_body as any).signinResponse).toBeDefined();
        });

        it('Should return 400 if wallet address is missing', async () => {
            const req = new DummyFastifyRequest({ signature: 'valid_signature' }) as ApiFastifyRequestType;
            const res = new DummyFastifyReply() as FastifyReply;
            const res_body = await walletApiService.signin(req, res);
            expect(res.statusCode).toBe(400);
            expect((res_body as any).error?.id).toStrictEqual('wallet_address_missing');
        });

        it('Should return 400 if signature is invalid', async () => {
            const req = new DummyFastifyRequest({
                walletAddress: '0x1234567890abcdef',
                signature: 'invalid_signature',
            }) as ApiFastifyRequestType;
            const res = new DummyFastifyReply() as FastifyReply;
            const res_body = await walletApiService.signin(req, res);
            expect(res.statusCode).toBe(400);
            expect((res_body as any).error?.id).toStrictEqual('invalid_signature');
        });
    });
});
