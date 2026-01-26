// Camada de Domínio - Value Object Dinheiro
// Representa valores monetários com validação e operações

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('O valor não pode ser negativo');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('A moeda deve ser um código de 3 letras (ex: BRL, USD)');
    }
  }

  static create(amount: number, currency: string = 'BRL'): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string = 'BRL'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Não é possível somar moedas diferentes: ${this.currency} e ${other.currency}`);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Não é possível subtrair moedas diferentes: ${this.currency} e ${other.currency}`);
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}
