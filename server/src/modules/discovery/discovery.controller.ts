// src/discovery/discovery.controller.ts

import {
    BadRequestException,
    Controller,
    Get,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";

import type { Request } from "express";

import {
    DiscoveryService,
    type DiscoveryResponse,
} from "./discovery.service";

import { FirebaseAuthGuard } from "../../common/guards/firebase.guard";

interface AuthenticatedRequest extends Request {
    user: {
        uid: string;
    };
}

@Controller("discovery")
@UseGuards(FirebaseAuthGuard)
export class DiscoveryController {
    constructor(
        private readonly discoveryService: DiscoveryService,
    ) { }

    @Get()
    async getDiscovery(
        @Req() req: AuthenticatedRequest,
        @Query("limit") limitParam?: string,
        @Query("cursor") cursor?: string,
    ): Promise<DiscoveryResponse> {
        const limit =
            limitParam === undefined ? 10 : Number(limitParam);

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 20
        ) {
            throw new BadRequestException(
                "limit must be between 1 and 20",
            );
        }

        return this.discoveryService.discover(
            req.user.uid,
            limit,
            cursor,
        );
    }
}