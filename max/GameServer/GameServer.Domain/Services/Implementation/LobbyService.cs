using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using OneOf.Types;

namespace GameServer.Domain.Services.Implementation;

public class LobbyService(ILobbyRepository lobbyRepository) : ILobbyService
{
    private const string LobbyJoinCodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private const int LobbyJoinCodeLength = 6;

    private static string RandomString(int length, string chars) =>
        new(Enumerable.Repeat(chars, length)
            .Select(s => s[Random.Shared.Next(s.Length)]).ToArray());

    public async Task<CreateLobbyResult> CreateLobbyAsync(Guid hostId, CancellationToken token = default)
    {
        var existingLobby = await lobbyRepository.GetLobbyByHostIdAsync(hostId, token);
        if (existingLobby != null)
            return new AlreadyExists();

        var joinCode = RandomString(LobbyJoinCodeLength, LobbyJoinCodeChars);
        var lobby = await lobbyRepository.CreateLobbyAsync(hostId, joinCode, token);

        return lobby is null ? new Error<string>("Failed to create lobby") : lobby;
    }

    public async Task<LobbyResult> GetLobbyByIdAsync(Guid lobbyId, CancellationToken token = default)
    {
        var lobby = await lobbyRepository.GetLobbyByIdAsync(lobbyId, token);
        return lobby is null ? new NotFound() : lobby;
    }

    public async Task<DisbandLobbyResult> DisbandLobbyAsync(Guid lobbyId, CancellationToken token = default)
    {
        var lobby = await lobbyRepository.GetLobbyByIdAsync(lobbyId, token);
        if (lobby is null)
            return new NotFound();

        await lobbyRepository.DeleteLobbyAsync(lobbyId, token);
        return new Success();
    }

    public async Task<JoinLobbyResult> JoinLobbyAsync(Guid userId, string joinCode, CancellationToken token = default)
    {
        if (await lobbyRepository.UserIsInLobbyAsync(userId, token))
            return new AlreadyExists();

        var lobby = await lobbyRepository.GetLobbyByJoinCodeAsync(joinCode, token);
        if (lobby is null)
            return new NotFound();

        if (lobby.Status != LobbyStatus.Open)
            return new LobbyClosed();

        lobby = await lobbyRepository.AddUserToLobbyAsync(lobby.Id, userId, token);
        return lobby is null ? new Error<string>("Failed to join lobby") : lobby;
    }

    public async Task<LeaveLobbyResult> LeaveLobbyAsync(Guid userId, CancellationToken token = default)
    {
        var lobby = await lobbyRepository.GetLobbyByUserIdAsync(userId, token);
        if (lobby is null)
            return new NotFound();

        lobby = await lobbyRepository.RemoveUserFromLobbyAsync(lobby.Id, userId, token);
        return lobby is null ? new Error<string>("Failed to leave lobby") : lobby;
    }
}