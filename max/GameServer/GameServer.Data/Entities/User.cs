namespace GameServer.Data.Entities;

internal class User
{
    public Guid Id { get; set; }

    public required string Username { get; set; }
    public required string DisplayName { get; set; }

    public required byte[] PasswordSalt { get; set; }
    public required byte[] PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AuthSession> Sessions { get; set; } = [];
    public ICollection<AuthRole> Roles { get; set; } = [];
}