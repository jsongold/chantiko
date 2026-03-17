import json
import logging
import time


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "ts": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "msg": record.getMessage(),
            "module": record.module,
            "fn": record.funcName,
        }
        for key in ("user_id", "endpoint", "method", "duration_ms", "status_code"):
            value = getattr(record, key, None)
            if value is not None:
                log_entry[key] = value
        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


_configured = False


def configure_logging():
    global _configured
    if _configured:
        return
    _configured = True

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root.handlers = [handler]


def add_logging_middleware(app):
    from starlette.requests import Request

    @app.middleware("http")
    async def logging_middleware(request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000, 1)

        user_id = getattr(request.state, "user_id", "anon")
        if user_id != "anon":
            user_id = user_id[:8]

        logger = logging.getLogger("api.request")
        logger.info(
            "%s %s %s %.1fms",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            extra={
                "method": request.method,
                "endpoint": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
            },
        )
        return response
