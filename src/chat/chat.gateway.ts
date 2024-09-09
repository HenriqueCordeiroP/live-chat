import { UseFilters } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
  BaseWsExceptionFilter,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway(Number(process.env.WEBSOCKET_PORT) || 80)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly authService: AuthService) {}
  @WebSocketServer() server: Server;

  @UseFilters(new BaseWsExceptionFilter())
  async handleConnection(client: Socket) {
    const { accessToken, chatId } = client.handshake.query;
    if (!accessToken) {
      throw new WsException('Unauthorized: No token provided.');
    }

    try {
      const isAccessTokenValid = await this.authService.verifyAccessToken(accessToken as string);
      if (!isAccessTokenValid) return;
      client.join(chatId as string);
      console.log(`Client ${client.id} connected.`);
    } catch (error) {
      client.emit('exception', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload): void {
    const chatId = client.handshake.query.chatId;
    this.server.to(chatId).emit('message', payload);
  }
}
