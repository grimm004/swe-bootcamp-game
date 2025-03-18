namespace GameServer.Domain.Models;

public sealed record Lobby
{
    public Guid Id { get; init; }
    public string JoinCode { get; init; } = null!;
    public Guid HostId { get; init; }
    public LobbyStatus Status { get; init; }

    public IEnumerable<User> Users { get; init; } = [];
}