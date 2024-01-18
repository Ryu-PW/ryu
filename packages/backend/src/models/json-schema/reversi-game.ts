/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedReversiGameSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		startedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		isStarted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isEnded: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		form1: {
			type: 'any',
			optional: false, nullable: true,
		},
		form2: {
			type: 'any',
			optional: false, nullable: true,
		},
		user1Accepted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		user2Accepted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		user1Id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user2Id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user1: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
		user2: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
		winnerId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		winner: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'User',
		},
		surrendered: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		black: {
			type: 'number',
			optional: false, nullable: true,
		},
		bw: {
			type: 'string',
			optional: false, nullable: false,
		},
		isLlotheo: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canPutEverywhere: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		loopedBoard: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		logs: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'object',
				optional: true, nullable: false,
				properties: {
					at: {
						type: 'string',
						optional: false, nullable: false,
						format: 'date-time',
					},
					color: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					pos: {
						type: 'number',
						optional: false, nullable: false,
					},
				},
			},
		},
		map: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;