const { Inventaris, Category, User, Department } = require('../model');


const createInventaris = async (req, res) => {
    try {
        const { name, serial_number, status, id_user, id_category } = req.body;

        if (!name || !serial_number || !id_category) {
            return res.status(400).json({ 
                message: 'Name, serial_number, dan id_category wajib diisi' 
            });
        }

        const inventaris = await Inventaris.create({
            name,
            serial_number,
            status: status || (id_user ? 'in_use' : 'available'),
            id_user: id_user || null,
            id_category
        });

        res.status(201).json({ 
            message: 'Inventaris created successfully', 
            inventaris 
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Serial number sudah terdaftar' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllInventaris = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Inventaris.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['id', 'DESC']],
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id_category', 'name']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id_user', 'username'],
                    include: [
                        {
                            model: Department,
                            as: 'department',
                            attributes: ['id_departmans', 'name']
                        }
                    ]
                }
            ]
        });

        res.status(200).json({
            inventaris: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteInventaris = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedInventaris = await Inventaris.destroy({ where: { id } });
        if (deletedInventaris) {
            res.status(200).json({ message: 'Inventaris deleted successfully' });
        } else {
            res.status(404).json({ message: 'Inventaris not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateInventaris = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, serial_number, status, id_user, id_category } = req.body;
        const [updated] = await Inventaris.update(
            { name, serial_number, status, id_user, id_category },
            { where: { id } }
        );
        if (updated) {
            const updatedInventaris = await Inventaris.findOne({ where: { id } });
            res.status(200).json({ message: 'Inventaris updated successfully', inventaris: updatedInventaris });
        } else {
            res.status(404).json({ message: 'Inventaris not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createInventaris,
    getAllInventaris,
    deleteInventaris,
    updateInventaris
};