import { Router } from 'express';
import * as tokenService from './service';

const router = Router();

/**
 * @route GET /api/tokens
 * @description 获取所有可用代币列表
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const tokens = await tokenService.getAllTokens();
    res.json(tokens);
  } catch (error) {
    console.error('获取代币列表失败:', error);
    res.status(500).json({ error: '获取代币列表失败', details: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * @route GET /api/tokens/metadata/:address
 * @description 获取特定代币的元数据
 * @param address 代币元数据对象地址
 * @access Public
 */
router.get('/metadata/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const metadata = await tokenService.getTokenMetadata(address);
    
    if (!metadata) {
      return res.status(404).json({ error: '未找到代币元数据' });
    }
    
    res.json(metadata);
  } catch (error) {
    console.error('获取代币元数据失败:', error);
    res.status(500).json({ error: '获取代币元数据失败', details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
