using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;
using GameServer.Api.Constants;
using GameServer.Domain.Services;

namespace GameServer.Api.Auth;

[ExcludeFromCodeCoverage]
internal sealed class SessionAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory loggerFactory,
    UrlEncoder encoder,
    IAuthService authService,
    ILogger<SessionAuthenticationHandler> logger)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, loggerFactory, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        logger.LogInformation("Authenticating request: {Path}", Request.Path);

        if (!TryGetCookieToken(out var authToken) && !TryGetBearerToken(out authToken))
        {
            logger.LogWarning("Could not resolve bearer header or cookie token");
            return AuthenticateResult.NoResult();
        }

        var authTokenData = new byte[32];

        if (!Convert.TryFromBase64String(authToken, authTokenData, out var bytesWritten) || bytesWritten != authTokenData.Length)
        {
            logger.LogWarning("Invalid token provided");
            return AuthenticateResult.Fail("Invalid token provided");
        }

        var authResult = await authService.GetSessionAsync(authTokenData, Context.RequestAborted);

        if (!authResult.IsT0)
        {
            logger.LogWarning("Invalid token provided");
            return AuthenticateResult.Fail("Invalid token or session not found");
        }

        var session = authResult.AsT0!;

        if (session.ExpiresAt < DateTime.UtcNow)
        {
            logger.LogWarning("Session expired");
            return AuthenticateResult.Fail("Session expired");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, session.User.Id.ToString()),
            new(ClaimTypes.Name, session.User.Username)
        };

        claims.AddRange(session.User.Roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        logger.LogInformation("User {UserId} authenticated with roles: {Roles}",
            session.User.Id, string.Join(", ", session.User.Roles));

        Context.Items["UserSession"] = session;
        Context.Items["User"] = session.User;
        Context.Items["TokenData"] = authTokenData;

        return AuthenticateResult.Success(ticket);
    }

    private bool TryGetBearerToken([NotNullWhen(true)] out string? token)
    {
        token = null;

        if (!Request.Headers.TryGetValue(HttpHeaders.Authorization, out var authHeader) ||
            !authHeader.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return false;

        token = authHeader.ToString()["Bearer ".Length..].Trim();
        logger.LogInformation("Resolved session token from bearer token in Authorization header.");
        return true;
    }

    private bool TryGetCookieToken([NotNullWhen(true)] out string? token)
    {
        token = null;

        if (!Request.Cookies.TryGetValue(AuthCookies.SessionCookie, out var cookieValue) ||
            string.IsNullOrEmpty(cookieValue))
            return false;

        token = cookieValue;
        logger.LogInformation("Resolved session token from cookie.");
        return true;
    }
}
