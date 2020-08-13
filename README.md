# angular-json-refs-interceptor
Interceptor for Angular when using Json.NET's PreserveReferencesHandling

## Usage
In the `Startup.cs` file of your .NET project (web API), add the `PreserveReferencesHandling` option to Json Newtonsoft. Don't forget to do the same for SignalR if you use it.
```c#
services.AddControllers().AddNewtonsoftJson(o =>
{
    o.SerializerSettings.PreserveReferencesHandling = PreserveReferencesHandling.Objects;
});
```
In your angular project in the `app.module.ts`, use the interceptor

  ```Typescript
  import { RefsInterceptor } from './interceptors/refs.interceptor';

  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: RefsInterceptor, multi: true },
  ],
  ```

## Thanks
* Thanks to [Gaurav](https://stackoverflow.com/users/1163736/gaurav) for his [post](https://stackoverflow.com/a/15333930/1560347)
* Thanks to [Alexander Vasilyev](https://stackoverflow.com/users/1909640/alexander-vasilyev) for his [post](https://stackoverflow.com/a/15757499/1560347)
