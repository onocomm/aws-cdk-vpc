import { Stack, StackProps, Tags, CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class CdkVpcStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPCの作成 - シンプルなパブリックサブネットのみの構成
    this.vpc = new ec2.Vpc(this, 'MainVpc', {
      maxAzs: 2,  // 2つのアベイラビリティゾーンを使用
      cidr: '10.0.0.0/16',  // VPCのCIDRブロック
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,  // パブリックサブネット（インターネットゲートウェイへのルートあり）
          cidrMask: 24,
        }
      ],
      natGateways: 0,  // NATゲートウェイなし
      enableDnsHostnames: true, // DNSホスト名を有効化
      enableDnsSupport: true,   // DNSサポートを有効化
    });

    // VPCにタグを付ける
    Tags.of(this.vpc).add('Name', 'MainVpc');
    Tags.of(this.vpc).add('Environment', 'Development');

    // S3へのVPCエンドポイントを追加（VPC内からS3へのプライベートアクセス用）
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // DynamoDBへのVPCエンドポイントを追加（VPC内からDynamoDBへのプライベートアクセス用）
    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // 出力
    // VPC ID
    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'MainVpcId',
    });

    // パブリックサブネットIDs
    const publicSubnetIds = this.vpc.publicSubnets.map(subnet => subnet.subnetId);
    new CfnOutput(this, 'PublicSubnetIds', {
      value: publicSubnetIds.join(','),
      description: 'パブリックサブネットIDs',
      exportName: 'MainVpcPublicSubnetIds',
    });
    
    // 注：この構成ではプライベートサブネットはありません
  }
}
