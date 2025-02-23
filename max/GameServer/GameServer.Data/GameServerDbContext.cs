using GameServer.Data.Entities;
using GameServer.Data.EntityDbMappers;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data;

public class GameServerDbContext(DbContextOptions<GameServerDbContext> options) : DbContext(options)
{
    internal DbSet<User> Users => Set<User>();
    internal DbSet<AuthRole> AuthRoles => Set<AuthRole>();
    internal DbSet<AuthSession> AuthSessions => Set<AuthSession>();
    internal DbSet<Lobby> Lobbies => Set<Lobby>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder
            .ApplyConfiguration(new UserMapping())
            .ApplyConfiguration(new AuthRoleMapping())
            .ApplyConfiguration(new AuthSessionMapping())
            .ApplyConfiguration(new LobbyMapping());
}