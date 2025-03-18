namespace GameServer.Data.Entities;

internal sealed class AuthRole
{
    public required string Name { get; set; }
    public required string Description { get; set; }

    public ICollection<User> Users { get; set; } = [];
}