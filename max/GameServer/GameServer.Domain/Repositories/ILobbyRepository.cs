using GameServer.Domain.Models;

namespace GameServer.Domain.Repositories;

public interface ILobbyRepository
{
    Task<Lobby?> CreateLobbyAsync(Guid hostId, string joinCode, CancellationToken token = default);
    Task<Lobby?> GetLobbyByIdAsync(Guid lobbyId, CancellationToken token = default);
    Task<Lobby?> GetLobbyByJoinCodeAsync(string joinCode, CancellationToken token = default);
    Task<Lobby?> GetLobbyByHostIdAsync(Guid hostId, CancellationToken token = default);
    Task<Lobby?> GetLobbyByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<bool> DeleteLobbyAsync(Guid lobbyId, CancellationToken token = default);
    Task<bool> UserIsInLobbyAsync(Guid userId, CancellationToken token = default);
    Task<Lobby?> AddUserToLobbyAsync(Guid lobbyId, Guid userId, CancellationToken token = default);
    Task<Lobby?> RemoveUserFromLobbyAsync(Guid lobbyId, Guid userId, CancellationToken token = default);
}