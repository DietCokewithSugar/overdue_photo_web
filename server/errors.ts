export class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = '请求参数错误') {
    super(message, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = '未登录或会话失效') {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = '没有访问权限') {
    super(message, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

export class ConflictError extends HttpError {
  constructor(message = '资源状态冲突') {
    super(message, 409);
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message = '请求数据格式有误') {
    super(message, 422);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = '服务器内部错误') {
    super(message, 500);
  }
}
