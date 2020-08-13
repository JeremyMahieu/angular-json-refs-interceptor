import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpResponse
  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, filter } from 'rxjs/operators';

export class RefsInterceptor implements HttpInterceptor {
    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            filter(event => event instanceof HttpResponse),
            tap((event: HttpResponse<any>) => {
                  this.resolveReferences(event.body);
              })
        );
    }

    private resolveReferences(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        const byid = {}; // all objects by id
        const refs = []; // references to objects that could not be resolved
        json = (function recurse(obj, prop, parent) {
            if (typeof obj !== 'object' || !obj) { // a primitive value
                return obj;
            }
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                for (let i = 0; i < obj.length; i++) {
                    // check also if the array element is not a primitive value
                    if (typeof obj[i] !== 'object' || !obj[i]) { // a primitive value
                        continue;
                    }
                    else if ('$ref' in obj[i]) {
                        obj[i] = recurse(obj[i], i, obj);
                    }
                    else {
                        obj[i] = recurse(obj[i], prop, obj);
                    }
                }
                return obj;
            }
            if ('$ref' in obj) { // a reference
                const ref2 = obj.$ref;
                if (ref2 in byid) {
                    return byid[ref2];
                }
                // else we have to make it lazy:
                refs.push([parent, prop, ref2]);
                return;
            } else if ('$id' in obj) {
                const id = obj.$id;
                delete obj.$id;
                if ('$values' in obj) { // an array
                    obj = obj.$values.map(recurse);
                }
                else { // a plain object
                    for (const prop2 in obj) {
                        obj[prop2] = recurse(obj[prop2], prop2, obj);
                    }
                }
                byid[id] = obj;
            }
            return obj;
        })(json); // run it!

        for (const ref of refs) { // resolve previously unknown references
            ref[0][ref[1]] = byid[ref[2]];
            // Notice that this throws if you put in a reference at top-level
        }
        return json;
    }
}
