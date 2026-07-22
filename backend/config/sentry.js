const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only enabled in production by default
 */
function initSentry(app) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sentryDsn = process.env.SENTRY_DSN;

  // Only initialize if DSN is provided and we're in production
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      
      // Performance Monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
      
      // Profiling
      profilesSampleRate: isProduction ? 0.1 : 1.0,
      
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Ignore common non-critical errors
      ignoreErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'AbortError',
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive query params
        if (event.request?.query_string) {
          const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
          sensitiveParams.forEach(param => {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=***REDACTED***`
            );
          });
        }

        return event;
      },
    });

    console.log('✅ Sentry error tracking initialized');
    
    // Set up Express error handler
    if (app) {
      // RequestHandler creates a separate execution context using domains
      app.use(Sentry.Handlers.requestHandler());
      
      // TracingHandler creates a trace for every incoming request
      app.use(Sentry.Handlers.tracingHandler());
    }
  } else {
    console.log('ℹ️  Sentry not configured (SENTRY_DSN not set)');
  }
}

/**
 * Get Sentry error handler middleware for Express
 * This should be added AFTER all routes but BEFORE other error handlers
 */
function getSentryErrorHandler() {
  // Return no-op middleware if Sentry is not initialized
  if (!process.env.SENTRY_DSN) {
    return (err, req, res, next) => next(err);
  }

  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.status >= 500) {
        return true;
      }
      // Don't capture 4xx errors (client errors)
      return false;
    },
  });
}

/**
 * Manually capture an exception
 */
function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually log a message
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level, // 'fatal', 'error', 'warning', 'log', 'info', 'debug'
    extra: context,
  });
}

/**
 * Add user context to Sentry events
 */
function setUserContext(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

module.exports = {
  initSentry,
  getSentryErrorHandler,
  captureException,
  captureMessage,
  setUserContext,
  Sentry,
};
