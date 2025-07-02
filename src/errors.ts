type ResponseErrorData = {
  status: number;
  message: string;
};

export class ResponseError {
  public readonly status: number;
  public readonly message: string;

  constructor(data: ResponseErrorData) {
    this.status = data.status;
    this.message = data.message;
  }

  toString = () => {
    return `${this.status ? `Status ${this.status}: ` : ''}${this.message}`;
  };
}

export class CertError extends ResponseError {
  constructor() {
    super({
      status: 0,
      message: 'ERR_CERT_AUTHORITY_INVALID',
    });
  }
}

export class NetworkError extends ResponseError {
  constructor(message?: string) {
    super({
      status: 0,
      message: message ?? 'NETWORK ERROR',
    });
  }
}
