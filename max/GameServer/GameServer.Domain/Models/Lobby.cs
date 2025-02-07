namespace GameServer.Domain.Models;

public class Lobby
{
    public Guid Id { get; set; }
    public string JoinCode { get; set; } = null!;
    public Guid HostId { get; set; }
    public LobbyStatus Status { get; set; }

    public IEnumerable<User> Users { get; set; } = [];
}