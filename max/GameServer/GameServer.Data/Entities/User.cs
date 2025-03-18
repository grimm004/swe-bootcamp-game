namespace GameServer.Data.Entities;

internal sealed class User
{
    public Guid Id { get; set; }

    public required string Username { get; set; }
    public required string DisplayName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public UserAuthCredentials AuthCredentials { get; set; } = null!;

    public Guid? LobbyId { get; set; }

    public ICollection<AuthSession> Sessions { get; set; } = [];
    public ICollection<AuthRole>? Roles { get; set; } = [];
    public Lobby? Lobby { get; set; }
}