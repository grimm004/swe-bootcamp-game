using Microsoft.AspNetCore.StaticFiles;

namespace GameServer.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseGameFileServer(this IApplicationBuilder applicationBuilder) =>
        applicationBuilder.UseFileServer(new FileServerOptions
        {
            StaticFileOptions =
            {
                ContentTypeProvider = new FileExtensionContentTypeProvider
                {
                    Mappings =
                    {
                        [".glsl"] = "text/plain",
                        [".obj"] = "text/plain"
                    }
                }
            }
        });
}