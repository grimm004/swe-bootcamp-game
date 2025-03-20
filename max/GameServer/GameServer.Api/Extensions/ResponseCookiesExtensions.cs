using GameServer.Api.Constants;

namespace GameServer.Api.Extensions;

public static class ResponseCookiesExtensions
{
    public static void AppendSessionToken(this IResponseCookies cookies, string token, DateTimeOffset expiresAt) =>
        cookies.Append(AuthCookies.SessionCookie, token, new CookieOptions
        {
            Expires = expiresAt,
            IsEssential = true
        });
}