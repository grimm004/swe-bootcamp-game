namespace GameServer.Data.Entities;

internal sealed class Lobby
{
    public Guid Id { get; set; }
    public string JoinCode { get; set; } = null!;
    public Guid HostId { get; set; }
    public LobbyStatus Status { get; set; }

    public User Host { get; set; } = null!;
    public ICollection<User> Users { get; set; } = null!;
}

internal enum LobbyStatus
{
    Closed,
    Open,
    InGame
}