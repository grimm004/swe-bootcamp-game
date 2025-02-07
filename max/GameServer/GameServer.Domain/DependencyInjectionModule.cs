using GameServer.Domain.Services;
using GameServer.Domain.Services.Implementation;
using Microsoft.Extensions.DependencyInjection;

namespace GameServer.Domain;

public static class DependencyInjectionModule
{
    public static IServiceCollection AddDomain(this IServiceCollection services) =>
        services
            .AddScoped<IAdminAuthService, AdminAuthService>()
            .AddScoped<IAuthService, AuthService>();
}