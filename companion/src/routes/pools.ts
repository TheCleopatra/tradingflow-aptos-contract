import { Router } from 'express';
import { getAllPools, getPoolById, getPoolByTokenPair } from '../services';

const router = Router();

/**
 * @route GET /api/pools
 * @description 获取所有可用池子列表
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const pools = await getAllPools();
    res.json(pools);
  } catch (error) {
    console.error('获取池子列表失败:', error);
    res.status(500).json({ error: '获取池子列表失败', details: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * @route GET /api/pools/:poolId
 * @description 获取特定池子的详细信息
 * @param poolId 池子ID
 * @access Public
 */
router.get('/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await getPoolById(poolId);
    
    if (!pool) {
      return res.status(404).json({ error: '未找到池子' });
    }
    
    res.json(pool);
  } catch (error) {
    console.error('获取池子详情失败:', error);
    res.status(500).json({ error: '获取池子详情失败', details: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * @route GET /api/pools/pair
 * @description 根据代币对和费率等级获取池子
 * @query token1 第一个代币的元数据对象ID
 * @query token2 第二个代币的元数据对象ID
 * @query feeTier 费率等级 (0-3)
 * @access Public
 */
router.get('/pair', async (req, res) => {
  try {
    const { token1, token2, feeTier } = req.query;
    
    if (!token1 || !token2 || !feeTier) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const pool = await getPoolByTokenPair(
      token1.toString(),
      token2.toString(),
      parseInt(feeTier.toString())
    );
    
    if (!pool) {
      return res.status(404).json({ error: '未找到匹配的池子' });
    }
    
    res.json(pool);
  } catch (error) {
    console.error('获取池子失败:', error);
    res.status(500).json({ error: '获取池子失败', details: error instanceof Error ? error.message : String(error) });
  }
});

export const poolRoutes = router;
