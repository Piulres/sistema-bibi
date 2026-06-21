/** Erros do motor de comunicacao (sem implementacao de provider). */

export class CommunicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommunicationError";
  }
}

/** Nenhum adapter registrado para o provider/canal solicitado. */
export class CommunicationProviderNotConfiguredError extends CommunicationError {
  readonly providerId: string;
  readonly channel: string;

  constructor(providerId: string, channel: string) {
    super(
      `Provedor de comunicacao nao configurado: provider=${providerId}, channel=${channel}. ` +
        "Registre um adapter (SendGrid, Twilio ou Meta) antes de despachar mensagens.",
    );
    this.name = "CommunicationProviderNotConfiguredError";
    this.providerId = providerId;
    this.channel = channel;
  }
}

/** Operacao invalida para o contrato do provider. */
export class CommunicationOperationNotSupportedError extends CommunicationError {
  constructor(operation: string, providerName: string) {
    super(`Operacao "${operation}" nao suportada por ${providerName}.`);
    this.name = "CommunicationOperationNotSupportedError";
  }
}
