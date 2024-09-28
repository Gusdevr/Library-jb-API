const express = require('express');
const Sequelize = require('sequelize');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Módulo para manipular arquivos e diretórios

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuração para servir imagens de capas de livros
app.use('/img/capas-livro', express.static(path.join(__dirname, 'img/capas-livro')));

// Verificar se o diretório de upload existe, se não, criar o diretório
const uploadDir = path.join(__dirname, 'img/capas-livro');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para o upload de imagens
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'img/capas-livro'); // Diretório onde as imagens serão salvas
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`); // Nomeia o arquivo de forma única
    }
});
const upload = multer({ storage });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

// Definições dos Modelos
const Usuario = sequelize.define('Usuario', {
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: true
});

const Livro = sequelize.define('Livro', {
    titulo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    autor: {
        type: Sequelize.STRING,
        allowNull: false
    },
    quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    editora: {
        type: Sequelize.STRING,
        allowNull: false
    },
    assunto: {
        type: Sequelize.STRING,
        allowNull: false
    },
    faixaEtaria: {
        type: Sequelize.ENUM('Livre', 'Infantil', 'Infantojuvenil', 'Adulto'),
        allowNull: false
    },
    imagem: {
        type: Sequelize.STRING, // Caminho da imagem do livro
        allowNull: true
    }
}, {
    timestamps: true
});

const Emprestimo = sequelize.define('Emprestimo', {
    dataVencimento: {
        type: Sequelize.DATE,
        allowNull: false
    },
    renovações: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true
});

// Relacionamentos
Usuario.hasMany(Emprestimo);
Livro.hasMany(Emprestimo);
Emprestimo.belongsTo(Usuario);
Emprestimo.belongsTo(Livro);

// Sincronização com o banco de dados
sequelize.sync().then(() => {
    console.log('Banco de dados e tabelas criados!');
});

// Rotas para Livros

// Adicionar Livro com Upload de Imagem
app.post('/livros', upload.single('imagem'), async (req, res) => {
    try {
        const { titulo, autor, quantidade, editora, assunto, faixaEtaria } = req.body;
        const imagem = req.file ? req.file.filename : null;

        const livro = await Livro.create({ 
            titulo, 
            autor, 
            quantidade, 
            editora, 
            assunto, 
            faixaEtaria, 
            imagem 
        });

        res.status(201).json(livro);
    } catch (error) {
        console.error('Erro ao adicionar livro:', error); // Logar erro no servidor
        res.status(500).json({ erro: 'Erro no servidor: ' + error.message });
    }
});

// Atualizar Livro com Upload de Imagem
app.put('/livros/:id', upload.single('imagem'), async (req, res) => {
    try {
        const livroId = req.params.id;
        const { titulo, autor, quantidade, editora, assunto, faixaEtaria } = req.body;
        const livro = await Livro.findByPk(livroId);

        if (!livro) {
            return res.status(404).json({ erro: 'Livro não encontrado' });
        }

        livro.titulo = titulo || livro.titulo;
        livro.autor = autor || livro.autor;
        livro.quantidade = quantidade || livro.quantidade;
        livro.editora = editora || livro.editora;
        livro.assunto = assunto || livro.assunto;
        livro.faixaEtaria = faixaEtaria || livro.faixaEtaria;

        // Atualiza a imagem se uma nova for enviada
        if (req.file) {
            livro.imagem = req.file.filename;
        }

        await livro.save();
        res.status(200).json(livro);
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        res.status(500).json({ erro: 'Erro no servidor: ' + error.message });
    }
});

// Listar Todos os Livros
app.get('/livros', async (req, res) => {
    try {
        const livros = await Livro.findAll();
        res.status(200).json(livros);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Rotas para Usuários

// Registrar Usuário
app.post('/registrar', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const usuario = await Usuario.create({ nome, email, senha });
        res.status(201).json(usuario);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Atualizar Usuário
app.put('/usuarios/:id', async (req, res) => {
    try {
        const usuarioId = req.params.id;
        const { nome, email, senha } = req.body;

        const usuario = await Usuario.findByPk(usuarioId);

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        usuario.nome = nome || usuario.nome;
        usuario.email = email || usuario.email;
        usuario.senha = senha || usuario.senha;

        await usuario.save();
        res.status(200).json(usuario);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ where: { email, senha } });

        if (usuario) {
            res.status(200).json(usuario);
        } else {
            res.status(401).json({ erro: 'Credenciais inválidas' });
        }
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Aluguel de Livros
app.post('/alugar', async (req, res) => {
    try {
        const { usuarioId, livroId } = req.body;
        const usuario = await Usuario.findByPk(usuarioId);
        const livro = await Livro.findByPk(livroId);

        if (usuario && livro && livro.quantidade > 0) {
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 7);

            const emprestimo = await Emprestimo.create({
                UsuarioId: usuarioId,
                LivroId: livroId,
                dataVencimento
            });

            livro.quantidade -= 1;
            await livro.save();

            res.status(201).json(emprestimo);
        } else {
            res.status(400).json({ erro: 'Usuário ou livro inválido, ou livro não disponível' });
        }
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Devolução de Livros
app.delete('/devolver/:emprestimoId', async (req, res) => {
    try {
        const { emprestimoId } = req.params;
        const emprestimo = await Emprestimo.findByPk(emprestimoId);

        if (emprestimo) {
            const livro = await Livro.findByPk(emprestimo.LivroId);

            if (livro) {
                livro.quantidade += 1;
                await livro.save();
                await emprestimo.destroy();
                res.status(200).json({ mensagem: 'Livro devolvido com sucesso' });
            } else {
                res.status(400).json({ erro: 'Livro não encontrado' });
            }
        } else {
            res.status(400).json({ erro: 'ID de empréstimo inválido' });
        }
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Renovação de Empréstimo
app.post('/renovar', async (req, res) => {
    try {
        const { emprestimoId } = req.body;

        const emprestimo = await Emprestimo.findByPk(emprestimoId);

        if (emprestimo && emprestimo.renovações < 2) {
            emprestimo.renovações += 1;
            emprestimo.dataVencimento.setDate(emprestimo.dataVencimento.getDate() + 7);
            await emprestimo.save();

            res.status(200).json({ mensagem: 'Livro renovado com sucesso!' });
        } else {
            res.status(400).json({ erro: 'Não é possível renovar mais vezes' });
        }
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Listar Empréstimos por Usuário
app.get('/usuario/:usuarioId/emprestimos', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const emprestimos = await Emprestimo.findAll({
            where: { UsuarioId: usuarioId },
            include: [Livro]
        });
        res.status(200).json(emprestimos);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Listar Todos os Empréstimos
app.get('/livros-alugados', async (req, res) => {
    try {
        const emprestimos = await Emprestimo.findAll({
            include: [
                { model: Usuario, attributes: ['nome', 'email'] },
                { model: Livro, attributes: ['titulo', 'autor'] }
            ]
        });
        res.status(200).json(emprestimos);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Envio de E-mails para Notificação de Empréstimos
app.post('/enviar-email', async (req, res) => {
    const { email, livroTitulo } = req.body;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Notificação de Expiração de Empréstimo',
        text: `O empréstimo do livro "${livroTitulo}" está próximo do vencimento. Por favor, faça a devolução ou entre em contato para renovação.`
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return res.status(500).json({ erro: 'Erro ao enviar email' });
        } else {
            return res.status(200).json({ mensagem: 'Email enviado com sucesso!' });
        }
    });
});

// Configuração da Porta
const PORT = process.env.PORT || 3750;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
