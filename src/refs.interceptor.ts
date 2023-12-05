import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpResponse
  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as JSPON from 'jspon';

export class RefsInterceptor implements HttpInterceptor {

    static generateReferencesRequest(request: HttpRequest<any>): HttpRequest<any>{
        if (!request.body || typeof request.body === 'string' || request.body instanceof FormData) {
            return request;
        }
        const newRequest = request.clone({
            body: RefsInterceptor.generateReferences(request.body),
            setHeaders: { 'Content-Type': 'application/json' },
          });
        return newRequest;
    }

    static generateReferences(input: string): string{
        JSPON.setSettings({ idFieldName: '$id', preserveArrays: false });
        let newbody = JSPON.stringify(input);
        newbody = newbody.replace(/^"(.+(?="$))"$/, '$1'); // Remove starting and ending double quotes
        newbody = newbody.replaceAll(/"\$id":(\d+)/gi, '\"$$id\":\"$1\"'); // Put quotes around id numbers
        return newbody.replaceAll(/"\$ref":(\d+)/gi, '\"$$ref\":\"$1\"'); // Put quotes around ref numbers
    }

    static resolveReferences(json: any): any {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        const byid: any = {}; // all objects by id
        const refs: any[] = []; // references to objects that could not be resolved
        json = (function recurse(obj: any, prop?: string | number, parent?: any) {
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
                byid[id] = obj;
                if ('$values' in obj) { // an array
                    obj = obj.$values.map(recurse);
                    byid[id] = obj;
                }
                else { // a plain object
                    // tslint:disable-next-line: forin
                    for (const prop2 in obj) {
                       obj[prop2] = recurse(obj[prop2], prop2, obj);
                    }
                }
            }
            return obj;
        })(json); // run it!

        for (const ref of refs) { // resolve previously unknown references
            ref[0][ref[1]] = byid[ref[2]];
            // Notice that this throws if you put in a reference at top-level
        }
        return json;
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(RefsInterceptor.generateReferencesRequest(req)).pipe(
            map(event => {
                // Cannot use instanceof because types from this package do not equal the types of the user
                // tslint:disable-next-line: no-string-literal
                if (event['status']) {
                    event = (event as HttpResponse<any>).clone({
                        body: RefsInterceptor.resolveReferences((event as HttpResponse<any>).body)
                    });
                }
                return event;
            })
        );
    }
}
