using GameServer.Api.Contracts.Requests;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Endpoints.UserEndpoints;

public static class AuthEndpoints
{
    private const string AuthRoute = "/auth";
    private const string LoggerCategory = "AuthEndpoints";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder builder)
    {
        var authRoute = builder.MapGroup(AuthRoute);

        authRoute.MapAuthRegister();
        authRoute.MapAuthLogin();
        authRoute.MapAuthLogout();
        authRoute.MapAuthMe();
        authRoute.MapAuthUpdateMe();

        return builder;
    }

    private static RouteHandlerBuilder MapAuthRegister(this IEndpointRouteBuilder builder) => builder
        .MapPost("/register", async (RegisterRequest request, IAuthService authService, ILoggerFactory loggerFactory, CancellationToken token) =>
        {
            var logger = loggerFactory.CreateLogger(LoggerCategory);
            logger.LogInformation("Request to register user: {Username}, {DisplayName}", request.Username, request.DisplayName);

            var registerResult = await authService.RegisterAsync(request.MapToAuthRegistration(), token);

            return registerResult.Match<IResult>(
                user => Results.Created("/auth/me", user.MapToResponse()),
                _ => Results.Conflict(),
                Results.BadRequest);
        });

    private static RouteHandlerBuilder MapAuthLogin(this IEndpointRouteBuilder builder) => builder
        .MapPost("/login", async (LoginRequest request, IAuthService authService, CancellationToken token) =>
        {
            var loginResult = await authService.LoginAsync(request.MapToAuthCredentials(), token);

            return loginResult.Match<IResult>(
                authSession => Results.Ok(authSession.MapToResponse()),
                _ => Results.NotFound(),
                Results.BadRequest);
        });

    private static RouteHandlerBuilder MapAuthLogout(this IEndpointRouteBuilder builder) => builder
        .MapPost("/logout", async ([FromHeader(Name = "Authorization")] string authHeader, IAuthService authService, CancellationToken token) =>
        {
            var authToken = authHeader["Bearer ".Length..].Trim();

            var logoutResult = await authService.LogoutAsync(authToken, token);

            return logoutResult.Match<IResult>(
                _ => Results.NoContent(),
                _ => Results.NotFound(),
                Results.BadRequest);
        });

    private static RouteHandlerBuilder MapAuthMe(this IEndpointRouteBuilder builder) => builder
        .MapGet("/me", async ([FromHeader(Name = "Authorization")] string authHeader, IAuthService authService, CancellationToken token) =>
        {
            var authToken = authHeader["Bearer ".Length..].Trim();

            var authSession = await authService.GetSessionAsync(authToken, token);

            return authSession.Match<IResult>(
                session => Results.Ok(session.MapToResponse()),
                _ => Results.NotFound(),
                _ => Results.Unauthorized(),
                Results.BadRequest);
        });

    private static RouteHandlerBuilder MapAuthUpdateMe(this IEndpointRouteBuilder builder) => builder
        .MapPut("/me", async (UpdateUserRequest request, [FromHeader(Name = "Authorization")] string authHeader, IAuthService authService, CancellationToken token) =>
        {
            var authToken = authHeader["Bearer ".Length..].Trim();

            var authSession = await authService.UpdateProfileAsync(authToken, request.MapToUserUpdate(), token);

            return authSession.Match<IResult>(
                user => Results.Ok(user.MapToResponse()),
                _ => Results.NotFound(),
                _ => Results.Unauthorized(),
                Results.BadRequest);
        });
}