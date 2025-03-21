using GameServer.Data.Repositories;
using GameServer.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GameServer.Data;

public static class DependencyInjectionModule
{
    public static IServiceCollection AddGameServerData(
        this IServiceCollection services, Action<DbContextOptionsBuilder> dbContextOptions) =>
        services
            .AddDbContext<GameServerDbContext>(dbContextOptions)
            .AddRepositories();

    private static IServiceCollection AddRepositories(this IServiceCollection services) =>
        services
            .AddScoped<IUserRepository, UserRepository>()
            .AddScoped<IAuthRoleRepository, AuthRoleRepository>()
            .AddScoped<IAuthSessionRepository, AuthSessionRepository>()
            .AddScoped<ILobbyRepository, LobbyRepository>();

    public static async Task EnsureDatabaseCreatedAsync(this IServiceProvider serviceProvider)
    {
        await using var serviceScope = serviceProvider.CreateAsyncScope();
        await using var dbContext = serviceScope.ServiceProvider.GetRequiredService<GameServerDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
    }
}