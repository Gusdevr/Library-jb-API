
# API Node.JS

## 












## Prévia da Documentação da API

#### Cria todos os itens

```http
  POST /livros

```

| Parâmetro   | Tipo       | Descrição                           |
| :---------- | :--------- | :---------------------------------- 
| titulo      |	string     | Obrigatório.Título do livro
  autor	      | string     | Obrigatório.Autor do livro   
  quantidade  |	integer    | Obrigatório.Quantidade disponivel do livro      
  editora	  | string     | Obrigatório.Editora do livro
  assunto	  | string     | Obrigatório.Assunto do livro
  faixaEtaria |	string     | Obrigatório.Faixa  etária                             |



#### Retorna todos os itens


```http
  GET /livros

```

Retorna uma lista de todos os livros cadastrados na biblioteca.


#### Documentação Completa
https://documenter.getpostman.com/view/34447208/2sAXjF7tur

