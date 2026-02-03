import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WallService, CreateWallPostDto } from './wall.service';
import { AuthGuard } from '../auth';
import type { WallPostStatus } from '@prisma/client';

/**
 * Wall Controller
 *
 * Handles The Wall routes:
 * - Public: GET /wall (no auth)
 * - Participant: POST /wall, GET /wall/mine, DELETE /wall/:id
 * - Admin: GET /wall/admin, DELETE /wall/admin/:id, PATCH /wall/admin/:id/restore
 */
@Controller('wall')
export class WallController {
  constructor(private wallService: WallService) {}

  // ===== PUBLIC ENDPOINTS =====

  /**
   * Get public wall feed
   * No authentication required
   */
  @Get()
  async getPublicWall(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.wallService.getPublicWall(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ===== PARTICIPANT ENDPOINTS =====

  /**
   * Submit a new wall post
   * Auto-publishes immediately
   */
  @Post()
  @UseGuards(AuthGuard)
  async createPost(
    @Req() req: any,
    @Body() dto: any, // CreateWallPostDto
  ) {
    return this.wallService.createPost(req.user.id, dto);
  }

  /**
   * Get my own posts
   */
  @Get('mine')
  @UseGuards(AuthGuard)
  async getMyPosts(@Req() req: any) {
    return this.wallService.getUserPosts(req.user.id);
  }

  /**
   * Delete my own post
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteMyPost(@Req() req: any, @Param('id') postId: string) {
    return this.wallService.deleteOwnPost(req.user.id, postId);
  }

  // ===== ADMIN ENDPOINTS =====

  /**
   * Get all posts for admin moderation
   */
  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminWall(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: WallPostStatus,
  ) {
    // TODO: Add admin role check
    return this.wallService.getAdminWall(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
      status,
    );
  }

  /**
   * Get wall statistics
   */
  @Get('admin/stats')
  @UseGuards(AuthGuard)
  async getWallStats() {
    // TODO: Add admin role check
    return this.wallService.getWallStats();
  }

  /**
   * Remove a post (flag for removal)
   */
  @Delete('admin/:id')
  @UseGuards(AuthGuard)
  async removePost(@Req() req: any, @Param('id') postId: string) {
    // TODO: Add admin role check
    return this.wallService.removePost(postId, req.user.id);
  }

  /**
   * Restore a removed post
   */
  @Patch('admin/:id/restore')
  @UseGuards(AuthGuard)
  async restorePost(@Param('id') postId: string) {
    // TODO: Add admin role check
    return this.wallService.restorePost(postId);
  }
}
