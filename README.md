# angular-json-refs-interceptor [![npm version](http://img.shields.io/npm/v/angular-json-refs-interceptor.svg?style=flat)](https://npmjs.org/package/angular-json-refs-interceptor "View this project on npm")
Interceptor for dereferencing json `$ref` and `$id` tags. Useful for serilizing and deserializing circular references. The interceptor links all the objects together again in the proper order. Doing this it's possible to have the original circular references in json that you might have in .NET. This is especially usefull for projects that use Entity Framework. Due to automatically fix-up navigation properties, there can easily be many circular references.

## Usage
### In .NET
In the `Startup.cs` file of your .NET project (web API), add the `PreserveReferencesHandling` option to Json Newtonsoft. Don't forget to do the same for SignalR if you use it.
```c#
services.AddControllers().AddNewtonsoftJson(o =>
{
    o.SerializerSettings.PreserveReferencesHandling = PreserveReferencesHandling.Objects;
});
```
Or when using `System.Text.Json`
```c#
services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
});
```
Has to be set seperatly when using SingalR
```c#
services.AddSignalR().AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
});
```

### In Angular
Install the package
`npm install angular-json-refs-interceptor`

In `app.module.ts`, use the interceptor.

  ```Typescript
  import { RefsInterceptor } from 'angular-json-refs-interceptor';

  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: RefsInterceptor, multi: true },
  ],
  ```

## Thanks
* Thanks to [Gaurav](https://stackoverflow.com/users/1163736/gaurav) for his [post](https://stackoverflow.com/a/15333930/1560347)
* Thanks to [Alexander Vasilyev](https://stackoverflow.com/users/1909640/alexander-vasilyev) for his [post](https://stackoverflow.com/a/15757499/1560347)
