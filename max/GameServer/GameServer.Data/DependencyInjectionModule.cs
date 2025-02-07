using GameServer.Data.Entities;
using GameServer.Data.Mappers;
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

    public static DbContextOptionsBuilder UseRoleSeeding(this DbContextOptionsBuilder optionsBuilder, IEnumerable<Domain.Models.AuthRole> initialRoles) =>
        optionsBuilder
            .UseSeeding((context, _) =>
            {
                var roles = context.Set<AuthRole>().ToList();
                if (roles.Count != 0) return;
                context.Set<AuthRole>().AddRange(initialRoles.Select(r => new AuthRole { Name = r.Name, Description = r.Description }));
                context.SaveChanges();
            })
            .UseAsyncSeeding(async (context, _, cancellationToken) =>
            {
                var roles = await context.Set<AuthRole>().ToListAsync(cancellationToken);
                if (roles.Count != 0) return;
                await context.Set<AuthRole>().AddRangeAsync(initialRoles.Select(r => new AuthRole { Name = r.Name, Description = r.Description }), cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
            });

    private static IServiceCollection AddRepositories(this IServiceCollection services) =>
        services
            .AddScoped<IUserRepository, UserRepository>()
            .AddScoped<IAuthRoleRepository, AuthRoleRepository>()
            .AddScoped<IAuthSessionRepository, AuthSessionRepository>()
            .AddScoped<ILobbyRepository, LobbyRepository>();
}