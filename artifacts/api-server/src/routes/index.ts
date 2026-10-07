import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import inspectionsRouter from "./inspections";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(inspectionsRouter);
router.use(aiRouter);

export default router;
