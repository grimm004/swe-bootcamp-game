using GameServer.Data.Entities;
using GameServer.Data.Mappers;
using GameServer.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data.Repositories;

public class LobbyRepository(GameServerDbContext dbContext) : ILobbyRepository
{
    public async Task<Domain.Models.Lobby?> CreateLobbyAsync(Guid hostId, string joinCode, CancellationToken token = default)
    {
        var host = await dbContext.Users.FindAsync([hostId], cancellationToken: token);

        if (host is null)
            return null;

        var lobby = new Lobby
        {
            HostId = hostId,
            JoinCode = joinCode,
            Users = [host],
            Status = LobbyStatus.Open,
            Host = host
        };

        dbContext.Lobbies.Add(lobby);

        var updatedRows = await dbContext.SaveChangesAsync(token);
        return updatedRows > 0 ? lobby.MapToLobby() : null;
    }

    public async Task<Domain.Models.Lobby?> GetLobbyByIdAsync(Guid lobbyId, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies.AsNoTracking()
            .Include(l => l.Users)
            .FirstOrDefaultAsync(l => l.Id == lobbyId, token);

        return lobby?.MapToLobby();
    }

    public async Task<Domain.Models.Lobby?> GetLobbyByJoinCodeAsync(string joinCode, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies.AsNoTracking()
            .Include(l => l.Users)
            .FirstOrDefaultAsync(l => l.JoinCode == joinCode, token);

        return lobby?.MapToLobby();
    }

    public async Task<Domain.Models.Lobby?> GetLobbyByHostIdAsync(Guid hostId, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies.AsNoTracking()
            .Include(l => l.Users)
            .FirstOrDefaultAsync(l => l.HostId == hostId, token);

        return lobby?.MapToLobby();
    }

    public async Task<Domain.Models.Lobby?> GetLobbyByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies.AsNoTracking()
            .Include(l => l.Users)
            .FirstOrDefaultAsync(l => l.Users.Any(u => u.Id == userId), token);

        return lobby?.MapToLobby();
    }

    public async Task<bool> DeleteLobbyAsync(Guid lobbyId, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies.FindAsync([lobbyId], cancellationToken: token);

        if (lobby is null)
            return false;

        dbContext.Lobbies.Remove(lobby);

        var updatedRows = await dbContext.SaveChangesAsync(token);
        return updatedRows > 0;
    }

    public async Task<bool> UserIsInLobbyAsync(Guid userId, CancellationToken token = default)
    {
        return await dbContext.Lobbies.AnyAsync(l => l.Users.Any(u => u.Id == userId), token);
    }

    public async Task<Domain.Models.Lobby?> AddUserToLobbyAsync(Guid lobbyId, Guid userId, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies
            .Include(l => l.Users)
            .FirstOrDefaultAsync(l => l.Id == lobbyId, token);

        if (lobby is null)
            return null;

        var user = await dbContext.Users.FindAsync([userId], cancellationToken: token);

        if (user is null)
            return null;

        lobby.Users.Add(user);

        var updatedRows = await dbContext.SaveChangesAsync(token);
        return updatedRows > 0 ? lobby.MapToLobby() : null;
    }

    public async Task<Domain.Models.Lobby?> RemoveUserFromLobbyAsync(Guid lobbyId, Guid userId, CancellationToken token = default)
    {
        var lobby = await dbContext.Lobbies
            .Include(l => l.Users)
            .FirstOrDefaultAsync(l => l.Id == lobbyId, token);

        var user = lobby?.Users.FirstOrDefault(u => u.Id == userId);

        if (lobby is null || user is null)
            return null;

        lobby.Users.Remove(user);

        var updatedRows = await dbContext.SaveChangesAsync(token);
        return updatedRows > 0 ? lobby.MapToLobby() : null;
    }
}