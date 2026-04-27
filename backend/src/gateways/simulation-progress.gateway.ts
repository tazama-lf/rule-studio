import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ProgressUpdateDto } from '../services/send-to-dems/dto/send-to-dems.dto';

@WebSocketGateway({
  namespace: '/simulation',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean) : true,
    credentials: true,
  },
})
export class SimulationProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(SimulationProgressGateway.name);

  /**
   * Stores the last known progress update per jobId.
   * Used to replay state to clients that join after events have already fired.
   * Entries are cleaned up when a terminal state (completed/failed) is emitted.
   */
  private readonly jobStateCache = new Map<string, ProgressUpdateDto>();

  handleConnection(client: Socket): void {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  /**
   * Client emits `joinJob` with `{ jobId }` to subscribe to progress updates for that job.
   * The server joins the socket to the room `job:{jobId}` and immediately replays the
   * last known state so clients that arrive late (after processing has started) are not left blank.
   */
  @SubscribeMessage('joinJob')
  handleJoinJob(@ConnectedSocket() client: Socket, @MessageBody() payload: { jobId: string }): void {
    const room = `job:${payload.jobId}`;
    void client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('joinedJob', { jobId: payload.jobId, room });

    const lastState = this.jobStateCache.get(payload.jobId);
    if (lastState !== undefined) {
      this.logger.debug(`Replaying last known state for job ${payload.jobId} to late-joining client ${client.id}`);
      client.emit('simulationProgress', lastState);
    }
  }

  /**
   * Client emits `leaveJob` to stop receiving updates for a specific job.
   */
  @SubscribeMessage('leaveJob')
  handleLeaveJob(@ConnectedSocket() client: Socket, @MessageBody() payload: { jobId: string }): void {
    const room = `job:${payload.jobId}`;
    void client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  /**
   * Broadcasts a progress update to all clients in the job's room.
   * Called by SimulationProcessor once per 5% threshold and on completion/failure.
   * Also caches the update so late-joining clients receive the last known state on `joinJob`.
   */
  emitProgress(jobId: string, update: ProgressUpdateDto): void {
    this.jobStateCache.set(jobId, update);

    this.server.to(`job:${jobId}`).emit('simulationProgress', update);
    this.logger.debug(`Emitted progress for job ${jobId}: ${update.progress}% (${update.status})`);

    if (update.status === 'completed' || update.status === 'failed') {
      // Delay cleanup slightly so clients that join right at completion still get the terminal state
      setTimeout(() => {
        this.jobStateCache.delete(jobId);
        this.logger.debug(`Cleared cached state for terminal job ${jobId}`);
      }, 30_000);
    }
  }
}
