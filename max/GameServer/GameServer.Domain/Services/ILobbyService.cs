using GameServer.Domain.Models;
using OneOf;
using OneOf.Types;

namespace GameServer.Domain.Services;

public interface ILobbyService
{
    Task<CreateLobbyResult> CreateLobbyAsync(Guid hostId, CancellationToken token = default);
    Task<LobbyResult> GetLobbyByJoinCodeAsync(string joinCode, CancellationToken token = default);
    Task<LobbyResult> GetLobbyByIdAsync(Guid lobbyId, CancellationToken token = default);
    Task<DisbandLobbyResult> DisbandLobbyAsync(Guid lobbyId, CancellationToken token = default);
    Task<JoinLobbyResult> JoinLobbyAsync(Guid userId, string joinCode, CancellationToken token = default);
    Task<LeaveLobbyResult> LeaveLobbyAsync(Guid userId, CancellationToken token = default);
}

public struct LobbyClosed;

[GenerateOneOf]
public partial class CreateLobbyResult : OneOfBase<Lobby, Error<string>>;

[GenerateOneOf]
public partial class LobbyResult : OneOfBase<Lobby, NotFound, Error<string>>;

[GenerateOneOf]
public partial class DisbandLobbyResult : OneOfBase<Success, NotFound, Error<string>>;

[GenerateOneOf]
public partial class JoinLobbyResult : OneOfBase<Lobby, NotFound, LobbyClosed, Error<string>>;

[GenerateOneOf]
public partial class LeaveLobbyResult : OneOfBase<Lobby, NotFound, Error<string>>;