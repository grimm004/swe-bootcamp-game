namespace GameServer.Data.Entities;

internal class AuthRole
{
    public required string Name { get; set; }
    public required string Description { get; set; }

    public ICollection<User> Users { get; set; } = [];
}