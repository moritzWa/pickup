import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { CuriusHighlight } from "./CuriusHighlight";
import { CuriusLink } from "./CuriusLink";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_mentions" })
export class CuriusMention {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    fromUid!: number;

    @Column()
    toUid!: number;

    @ManyToOne(() => CuriusLink)
    @JoinColumn({ name: "link_id" })
    link!: CuriusLink;

    @ManyToOne(() => CuriusUser)
    @JoinColumn({ name: "user_id" })
    user!: CuriusUser;

    @ManyToOne(() => CuriusHighlight, { nullable: true })
    @JoinColumn({ name: "highlight_id" })
    highlight?: CuriusHighlight;

    @Column()
    createdDate!: Date;
}
