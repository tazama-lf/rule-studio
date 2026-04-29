import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ProgressUpdateDto } from '../services/send-to-dems/dto/send-to-dems.dto';

@WebSocketGateway({
  namespace: '/simulation',
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS ?? '')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : true,
    credentials: true,
  },
})
export class SimulationProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(SimulationProgressGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  /**
   * Client emits `joinJob` with `{ jobId }` to subscribe to progress updates for that job.
   * The server joins the socket to the room `job:{jobId}`.
   */
  @SubscribeMessage('joinJob')
  handleJoinJob(@ConnectedSocket() client: Socket, @MessageBody() payload: { jobId: string }): void {
    const room = `job:${payload.jobId}`;
    void client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('joinedJob', { jobId: payload.jobId, room });
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
   */
  emitProgress(jobId: string, update: ProgressUpdateDto): void {
    this.server.to(`job:${jobId}`).emit('simulationProgress', update);
    this.logger.debug(`Emitted progress for job ${jobId}: ${update.progress}% (${update.status})`);
  }
}
