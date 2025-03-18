using GameServer.Data.Entities;
using GameServer.Data.EntityDbMappers;
using GameServer.Domain.Services;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data;

internal class GameServerDbContext(DbContextOptions<GameServerDbContext> options, ISaltedHashService saltedHashService) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<AuthRole> AuthRoles => Set<AuthRole>();
    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();
    public DbSet<Lobby> Lobbies => Set<Lobby>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder
            .ApplyConfiguration(new UserMapping(saltedHashService))
            .ApplyConfiguration(new AuthRoleMapping())
            .ApplyConfiguration(new AuthSessionMapping())
            .ApplyConfiguration(new LobbyMapping());
}