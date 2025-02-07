using GameServer.Domain.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GameServer.Api.Attributes;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
public class RequireRoleAttribute(params string[] requiredRoles) : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.HttpContext.Items.TryGetValue("User", out var userObj) || userObj is not User user)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!requiredRoles.Any(role => user.Roles.Contains(role)))
        {
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }
}