import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'emptySymbol'
})
export class EmptySymbolPipe implements PipeTransform {
    transform(value: any, symbol = '-'): string {
        if (!value || value === '') {
            return symbol;
        }
        return value;
    }
}
