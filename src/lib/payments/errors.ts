/** Erros do motor de cobrança (sem implementação de gateway). */

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

/** Nenhum adapter registrado para o gateway/método solicitado. */
export class PaymentProviderNotConfiguredError extends PaymentError {
  readonly gatewayId: string;
  readonly method: string;

  constructor(gatewayId: string, method: string) {
    super(
      `Provedor de pagamento não configurado: gateway=${gatewayId}, method=${method}. ` +
        "Registre um adapter (Asaas, Efí ou Banco Inter) antes de emitir cobranças.",
    );
    this.name = "PaymentProviderNotConfiguredError";
    this.gatewayId = gatewayId;
    this.method = method;
  }
}

/** Operação inválida para o contrato do provider. */
export class PaymentOperationNotSupportedError extends PaymentError {
  constructor(operation: string, providerName: string) {
    super(`Operação "${operation}" não suportada por ${providerName}.`);
    this.name = "PaymentOperationNotSupportedError";
  }
}
