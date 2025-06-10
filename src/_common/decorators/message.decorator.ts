import { SetMetadata } from '@nestjs/common';

export const MESSAGE_KEY = 'CUSTOM_RESPONSE_MESSAGE';

export const Message = (message: string) => SetMetadata(MESSAGE_KEY, message);
